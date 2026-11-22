using graduation_project_backend.Models.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class CommunityMembershipConfiguration : IEntityTypeConfiguration<CommunityMembership>
{
    public void Configure(EntityTypeBuilder<CommunityMembership> builder)
    {
        builder.HasKey(membership => membership.Id);

        builder.Property(membership => membership.JoinedAtUtc)
            .IsRequired();

        builder.HasIndex(membership => new { membership.UserId, membership.CommunityId })
            .IsUnique()
            .HasFilter("[LeftAtUtc] IS NULL");

        builder.HasIndex(membership => membership.UserId);
        builder.HasIndex(membership => membership.CommunityId);

        builder.HasOne(membership => membership.User)
            .WithMany()
            .HasForeignKey(membership => membership.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(membership => membership.Community)
            .WithMany(community => community.Memberships)
            .HasForeignKey(membership => membership.CommunityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}