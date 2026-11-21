using graduation_project_backend.Models.Social;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BlockConfiguration : IEntityTypeConfiguration<Block>
{
    public void Configure(EntityTypeBuilder<Block> builder)
    {
        builder.HasKey(block => block.Id);

        builder.Property(block => block.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(block => new { block.BlockerId, block.BlockedUserId })
            .IsUnique()
            .HasFilter("[RemovedAtUtc] IS NULL");

        builder.HasIndex(block => block.BlockerId);
        builder.HasIndex(block => block.BlockedUserId);

        builder.HasOne(block => block.Blocker)
            .WithMany()
            .HasForeignKey(block => block.BlockerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(block => block.BlockedUser)
            .WithMany()
            .HasForeignKey(block => block.BlockedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_Blocks_NoSelfBlock",
            "[BlockerId] <> [BlockedUserId]"));
    }
}