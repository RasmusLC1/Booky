using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booky.Api.Migrations;

/// <inheritdoc />
public partial class _20261118170154_Init : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Products",
            columns: table => new
            {
                Id = table.Column<string>(type: "TEXT", nullable: false),
                Name = table.Column<string>(type: "TEXT", nullable: false),
                Author = table.Column<string>(type: "TEXT", nullable: false),
                PriceInCents = table.Column<int>(type: "INTEGER", nullable: false),
                FilePath = table.Column<string>(type: "TEXT", nullable: false),
                ImagePath = table.Column<string>(type: "TEXT", nullable: false),
                Description = table.Column<string>(type: "TEXT", nullable: false),
                Category = table.Column<string>(type: "TEXT", nullable: false),
                Length = table.Column<int>(type: "INTEGER", nullable: false),
                IsAvailableForPurchase = table.Column<bool>(type: "INTEGER", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Products", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<string>(type: "TEXT", nullable: false),
                Email = table.Column<string>(type: "TEXT", nullable: false),
                Username = table.Column<string>(type: "TEXT", nullable: false),
                Password = table.Column<string>(type: "TEXT", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "DownloadVerifications",
            columns: table => new
            {
                Id = table.Column<string>(type: "TEXT", nullable: false),
                ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                ProductId = table.Column<string>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DownloadVerifications", x => x.Id);
                table.ForeignKey(
                    name: "FK_DownloadVerifications_Products_ProductId",
                    column: x => x.ProductId,
                    principalTable: "Products",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Orders",
            columns: table => new
            {
                Id = table.Column<string>(type: "TEXT", nullable: false),
                PriceInCents = table.Column<int>(type: "INTEGER", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UserId = table.Column<string>(type: "TEXT", nullable: false),
                ProductId = table.Column<string>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Orders", x => x.Id);
                table.ForeignKey(
                    name: "FK_Orders_Products_ProductId",
                    column: x => x.ProductId,
                    principalTable: "Products",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Orders_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "PasswordResets",
            columns: table => new
            {
                Id = table.Column<string>(type: "TEXT", nullable: false),
                UserId = table.Column<string>(type: "TEXT", nullable: false),
                Token = table.Column<string>(type: "TEXT", nullable: false),
                ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PasswordResets", x => x.Id);
                table.ForeignKey(
                    name: "FK_PasswordResets_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Reviews",
            columns: table => new
            {
                Id = table.Column<string>(type: "TEXT", nullable: false),
                ProductId = table.Column<string>(type: "TEXT", nullable: false),
                UserId = table.Column<string>(type: "TEXT", nullable: false),
                Headline = table.Column<string>(type: "TEXT", nullable: true),
                Text = table.Column<string>(type: "TEXT", nullable: true),
                Rating = table.Column<int>(type: "INTEGER", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Reviews", x => x.Id);
                table.ForeignKey(
                    name: "FK_Reviews_Products_ProductId",
                    column: x => x.ProductId,
                    principalTable: "Products",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Reviews_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_DownloadVerifications_ProductId",
            table: "DownloadVerifications",
            column: "ProductId");

        migrationBuilder.CreateIndex(
            name: "IX_Orders_ProductId",
            table: "Orders",
            column: "ProductId");

        migrationBuilder.CreateIndex(
            name: "IX_Orders_UserId",
            table: "Orders",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_PasswordResets_Token",
            table: "PasswordResets",
            column: "Token",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_PasswordResets_UserId",
            table: "PasswordResets",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Reviews_ProductId",
            table: "Reviews",
            column: "ProductId");

        migrationBuilder.CreateIndex(
            name: "IX_Reviews_UserId",
            table: "Reviews",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            table: "Users",
            column: "Email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Users_Username",
            table: "Users",
            column: "Username",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "DownloadVerifications");

        migrationBuilder.DropTable(
            name: "Orders");

        migrationBuilder.DropTable(
            name: "PasswordResets");

        migrationBuilder.DropTable(
            name: "Reviews");

        migrationBuilder.DropTable(
            name: "Products");

        migrationBuilder.DropTable(
            name: "Users");
    }
}
