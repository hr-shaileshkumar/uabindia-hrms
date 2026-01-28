IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [BaseEntity] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedBy] uniqueidentifier NULL,
    [IsDeleted] bit NOT NULL,
    [Discriminator] nvarchar(21) NOT NULL,
    [OriginalAttendanceId] uniqueidentifier NULL,
    [ProposedTimestamp] datetime2 NULL,
    [Reason] nvarchar(max) NULL,
    [Status] nvarchar(max) NULL,
    [EmployeeId] uniqueidentifier NULL,
    [Timestamp] datetime2 NULL,
    [Latitude] decimal(18,2) NULL,
    [Longitude] decimal(18,2) NULL,
    [Source] nvarchar(max) NULL,
    [EntityName] nvarchar(max) NULL,
    [EntityId] uniqueidentifier NULL,
    [Action] nvarchar(max) NULL,
    [OldValue] nvarchar(max) NULL,
    [NewValue] nvarchar(max) NULL,
    [PerformedBy] uniqueidentifier NULL,
    [Ip] nvarchar(max) NULL,
    [FullName] nvarchar(max) NULL,
    [UserId] uniqueidentifier NULL,
    [TokenHash] nvarchar(max) NULL,
    [ExpiresAt] datetime2 NULL,
    [IsRevoked] bit NULL,
    [Subdomain] nvarchar(max) NULL,
    [Name] nvarchar(max) NULL,
    [IsActive] bit NULL,
    [Email] nvarchar(max) NULL,
    [PasswordHash] nvarchar(max) NULL,
    CONSTRAINT [PK_BaseEntity] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260127190639_Initial', N'8.0.0');
GO

COMMIT;
GO

