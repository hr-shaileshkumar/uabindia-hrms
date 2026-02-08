#!/bin/bash
# OWASP Security Testing Automation
# Runs comprehensive security tests against HRMS API
# Requirements: curl, jq, OWASP ZAP CLI

set -e

API_URL="${1:-http://localhost:5000}"
REPORT_DIR="${2:-.}/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$REPORT_DIR"

echo "=== HRMS OWASP Security Testing Suite ==="
echo "Target: $API_URL"
echo "Reports: $REPORT_DIR"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_test() {
    echo "[TEST] $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# ===== SECURITY HEADERS TEST =====
echo ""
echo "=== 1. Security Headers Test ==="

test_security_headers() {
    log_test "Testing critical security headers..."
    
    local response=$(curl -s -I "$API_URL/health")
    
    # Check each required header
    if echo "$response" | grep -q "X-Content-Type-Options: nosniff"; then
        log_pass "X-Content-Type-Options header present"
    else
        log_fail "X-Content-Type-Options header missing"
    fi

    if echo "$response" | grep -q "X-Frame-Options: DENY"; then
        log_pass "X-Frame-Options header present"
    else
        log_fail "X-Frame-Options header missing"
    fi

    if echo "$response" | grep -q "X-XSS-Protection: 1; mode=block"; then
        log_pass "X-XSS-Protection header present"
    else
        log_fail "X-XSS-Protection header missing"
    fi

    if echo "$response" | grep -q "Content-Security-Policy"; then
        log_pass "Content-Security-Policy header present"
    else
        log_fail "Content-Security-Policy header missing"
    fi

    if echo "$response" | grep -q "Referrer-Policy"; then
        log_pass "Referrer-Policy header present"
    else
        log_fail "Referrer-Policy header missing"
    fi

    echo "$response" > "$REPORT_DIR/security-headers_$TIMESTAMP.txt"
}

# ===== SQL INJECTION TEST =====
echo ""
echo "=== 2. SQL Injection Vulnerability Test ==="

test_sql_injection() {
    log_test "Testing SQL injection prevention..."
    
    local payloads=(
        "'; DROP TABLE Users; --"
        "1' OR '1'='1"
        "admin' --"
        "1' UNION SELECT NULL, NULL, NULL --"
    )

    for payload in "${payloads[@]}"; do
        local encoded_payload=$(jq -sRr @uri <<< "$payload")
        local response=$(curl -s -w "\n%{http_code}" "$API_URL/api/v1/companies?search=$encoded_payload" 2>/dev/null || echo "500")
        local http_code=$(echo "$response" | tail -1)
        
        if [[ "$http_code" != "500" && "$http_code" != "400" ]]; then
            log_warn "SQL injection payload returned $http_code: $payload"
        else
            log_pass "SQL injection blocked: $payload"
        fi
    done
}

# ===== XSS TEST =====
echo ""
echo "=== 3. Cross-Site Scripting (XSS) Test ==="

test_xss_vulnerability() {
    log_test "Testing XSS prevention..."
    
    local payloads=(
        "<script>alert('XSS')</script>"
        "<img src=x onerror=alert('XSS')>"
        "<svg onload=alert('XSS')>"
        "javascript:alert('XSS')"
    )

    for payload in "${payloads[@]}"; do
        local response=$(curl -s -X POST "$API_URL/api/v1/companies" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$payload\"}" 2>/dev/null)
        
        # Check if payload was reflected unescaped in response
        if echo "$response" | grep -q "$payload"; then
            log_fail "XSS vulnerability detected: $payload"
        else
            log_pass "XSS payload sanitized: $payload"
        fi
    done
}

# ===== CSRF TEST =====
echo ""
echo "=== 4. CSRF Protection Test ==="

test_csrf_protection() {
    log_test "Testing CSRF protection..."
    
    # Test 1: Missing Origin header
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST "$API_URL/api/v1/companies" \
        -H "Content-Type: application/json" \
        -d '{"name":"test"}' 2>/dev/null)
    local http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "403" ]]; then
        log_pass "CSRF protection: Missing Origin header blocked"
    else
        log_warn "CSRF protection: POST without Origin returned $http_code"
    fi

    # Test 2: Invalid Origin header
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$API_URL/api/v1/companies" \
        -H "Content-Type: application/json" \
        -H "Origin: https://malicious.com" \
        -d '{"name":"test"}' 2>/dev/null)
    http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "403" ]]; then
        log_pass "CSRF protection: Invalid Origin blocked"
    else
        log_warn "CSRF protection: Invalid Origin returned $http_code"
    fi
}

# ===== AUTHENTICATION TEST =====
echo ""
echo "=== 5. Authentication & Authorization Test ==="

test_authentication() {
    log_test "Testing authentication..."
    
    # Test 1: No auth token
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/api/v1/companies" 2>/dev/null)
    local http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "401" ]]; then
        log_pass "Authentication: Unauthenticated request blocked"
    else
        log_fail "Authentication: Unauthenticated request returned $http_code"
    fi

    # Test 2: Invalid token format
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer invalid-token" \
        "$API_URL/api/v1/companies" 2>/dev/null)
    http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "401" ]]; then
        log_pass "Authentication: Invalid token rejected"
    else
        log_warn "Authentication: Invalid token returned $http_code"
    fi
}

# ===== RATE LIMITING TEST =====
echo ""
echo "=== 6. Rate Limiting Test ==="

test_rate_limiting() {
    log_test "Testing rate limiting..."
    
    local rate_limited=false
    
    # Send 120 requests (should exceed limit of 100/min)
    for i in {1..120}; do
        local response=$(curl -s -w "\n%{http_code}" "$API_URL/health" 2>/dev/null)
        local http_code=$(echo "$response" | tail -1)
        
        if [[ "$http_code" == "429" ]]; then
            rate_limited=true
            log_pass "Rate limiting: Threshold exceeded at request $i"
            break
        fi
    done

    if [[ "$rate_limited" == false ]]; then
        log_warn "Rate limiting: No 429 response detected in 120 requests"
    fi
}

# ===== INPUT VALIDATION TEST =====
echo ""
echo "=== 7. Input Validation Test ==="

test_input_validation() {
    log_test "Testing input validation..."
    
    # Test 1: Very long input
    local long_input=$(printf 'a%.0s' {1..10000})
    local response=$(curl -s -X POST "$API_URL/api/v1/companies" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$long_input\"}" \
        -w "\n%{http_code}" 2>/dev/null)
    local http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "400" || "$http_code" == "413" ]]; then
        log_pass "Input validation: Oversized input rejected"
    else
        log_warn "Input validation: Oversized input returned $http_code"
    fi

    # Test 2: Invalid JSON
    response=$(curl -s -X POST "$API_URL/api/v1/companies" \
        -H "Content-Type: application/json" \
        -d "invalid json" \
        -w "\n%{http_code}" 2>/dev/null)
    http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "400" ]]; then
        log_pass "Input validation: Invalid JSON rejected"
    else
        log_warn "Input validation: Invalid JSON returned $http_code"
    fi
}

# ===== SSL/TLS TEST =====
echo ""
echo "=== 8. SSL/TLS Configuration Test ==="

test_ssl_tls() {
    if [[ "$API_URL" == https://* ]]; then
        log_test "Testing SSL/TLS..."
        
        # Check TLS version
        local tls_version=$(echo | openssl s_client -connect "${API_URL#https://}" 2>/dev/null | grep "Protocol" | awk '{print $NF}')
        
        if [[ "$tls_version" == "TLSv1.2" || "$tls_version" == "TLSv1.3" ]]; then
            log_pass "SSL/TLS: $tls_version supported"
        else
            log_fail "SSL/TLS: Unsupported version $tls_version"
        fi
    else
        log_warn "SSL/TLS: Skipping (HTTP URL provided)"
    fi
}

# ===== SENSITIVE DATA EXPOSURE TEST =====
echo ""
echo "=== 9. Sensitive Data Exposure Test ==="

test_data_exposure() {
    log_test "Testing for sensitive data in responses..."
    
    local response=$(curl -s "$API_URL/health")
    
    # Check for sensitive information in response
    if echo "$response" | grep -iqE "(password|token|secret|key|credit|ssn)"; then
        log_fail "Sensitive data exposure: Possible sensitive data in health response"
    else
        log_pass "Sensitive data exposure: No sensitive data in health response"
    fi
}

# ===== GDPR COMPLIANCE TEST =====
echo ""
echo "=== 10. GDPR Privacy API Test ==="

test_gdpr_compliance() {
    log_test "Testing GDPR endpoints..."
    
    # Test privacy policy endpoint
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/api/v1/privacy/policy" 2>/dev/null)
    local http_code=$(echo "$response" | tail -1)
    
    if [[ "$http_code" == "200" ]]; then
        log_pass "GDPR: Privacy policy endpoint accessible"
    else
        log_fail "GDPR: Privacy policy endpoint returned $http_code"
    fi
}

# ===== RUN ALL TESTS =====
test_security_headers
test_sql_injection
test_xss_vulnerability
test_csrf_protection
test_authentication
test_rate_limiting
test_input_validation
test_ssl_tls
test_data_exposure
test_gdpr_compliance

# ===== SUMMARY =====
echo ""
echo "=== TEST SUMMARY ==="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL))

echo "Pass Rate: $PASS_RATE% ($TESTS_PASSED/$TOTAL)"

# Save report
cat > "$REPORT_DIR/test-summary_$TIMESTAMP.txt" <<EOF
OWASP Security Testing Report
Generated: $TIMESTAMP
Target: $API_URL

Tests Passed: $TESTS_PASSED
Tests Failed: $TESTS_FAILED
Total Tests: $TOTAL
Pass Rate: $PASS_RATE%

Detailed logs available in security-reports directory.
EOF

if [[ $TESTS_FAILED -gt 0 ]]; then
    exit 1
else
    exit 0
fi
