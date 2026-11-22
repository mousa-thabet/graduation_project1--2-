using graduation_project_backend.Models.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BranchMembershipConfiguration : IEntityTypeConfiguration<BranchMembership>
{
    public void Configure(EntityTypeBuilder<BranchMembership> builder)
    {
        builder.HasKey(membership => membership.Id);

        builder.Property(membership => membership.JoinedAtUtc)
            .IsRequired();

        builder.HasIndex(membership => new { membership.UserId, membership.BranchId })
            .IsUnique()
            .HasFilter("[LeftAtUtc] IS NULL");

        builder.HasIndex(membership => membership.UserId);
        builder.HasIndex(membership => membership.BranchId);

        builder.HasOne(membership => membership.User)
            .WithMany()
            .HasForeignKey(membership => membership.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(membership => membership.Branch)
            .WithMany(branch => branch.Memberships)
            .HasForeignKey(membership => membership.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}