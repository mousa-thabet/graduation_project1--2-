using graduation_project_backend.Models.Social;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class FollowConfiguration : IEntityTypeConfiguration<Follow>
{
    public void Configure(EntityTypeBuilder<Follow> builder)
    {
        builder.HasKey(follow => follow.Id);

        builder.Property(follow => follow.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(follow => new { follow.FollowerId, follow.FollowedUserId })
            .IsUnique()
            .HasFilter("[UnfollowedAtUtc] IS NULL");

        builder.HasIndex(follow => follow.FollowerId);
        builder.HasIndex(follow => follow.FollowedUserId);

        builder.HasOne(follow => follow.Follower)
            .WithMany()
            .HasForeignKey(follow => follow.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(follow => follow.FollowedUser)
            .WithMany()
            .HasForeignKey(follow => follow.FollowedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_Follows_NoSelfFollow",
            "[FollowerId] <> [FollowedUserId]"));
    }
}