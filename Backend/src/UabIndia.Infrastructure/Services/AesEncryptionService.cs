using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services
{
    public class AesEncryptionService : IEncryptionService
    {
        private readonly byte[] _key;
        private readonly byte[] _iv;

        public AesEncryptionService(IConfiguration configuration)
        {
            var key = configuration["Encryption:Key"]
                ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY");

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException("Encryption key missing. Set Encryption:Key or ENCRYPTION_KEY.");
            }

            _key = SHA256.HashData(Encoding.UTF8.GetBytes(key));
            _iv = SHA256.HashData(Encoding.UTF8.GetBytes(key + "|iv")).AsSpan(0, 16).ToArray();
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            using var encryptor = aes.CreateEncryptor();
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
            return Convert.ToBase64String(cipherBytes);
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;
            try
            {
                using var aes = Aes.Create();
                aes.Key = _key;
                aes.IV = _iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                var cipherBytes = Convert.FromBase64String(cipherText);
                using var decryptor = aes.CreateDecryptor();
                var plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
                return Encoding.UTF8.GetString(plainBytes);
            }
            catch (FormatException)
            {
                return cipherText;
            }
            catch (CryptographicException)
            {
                return cipherText;
            }
        }
    }
}
