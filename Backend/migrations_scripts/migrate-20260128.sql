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

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260127190639_Initial'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260127190639_Initial'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260127190639_Initial', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BaseEntity]') AND [c].[name] = N'Longitude');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [BaseEntity] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [BaseEntity] ALTER COLUMN [Longitude] decimal(10,7) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[BaseEntity]') AND [c].[name] = N'Latitude');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [BaseEntity] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [BaseEntity] ALTER COLUMN [Latitude] decimal(10,7) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [DeviceId] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [EmployeeCode] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [GeoValidated] bit NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [ManagerId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [ParentTokenId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [ProjectId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [RefreshToken_DeviceId] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [ReplacedByTokenId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [RequestedBy] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [RevokedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    ALTER TABLE [BaseEntity] ADD [User_FullName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260128045923_AddRefreshTokenRotation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260128045923_AddRefreshTokenRotation', N'8.0.0');
END;
GO

COMMIT;
GO

