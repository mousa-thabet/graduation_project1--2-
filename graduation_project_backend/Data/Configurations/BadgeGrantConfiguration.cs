using graduation_project_backend.Models.Badge;
using CommunityEntity = graduation_project_backend.Models.Community.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BadgeGrantConfiguration : IEntityTypeConfiguration<BadgeGrant>
{
    public void Configure(EntityTypeBuilder<BadgeGrant> builder)
    {
        builder.HasKey(grant => grant.Id);

        builder.Property(grant => grant.Type)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(grant => grant.RevocationReason)
            .HasMaxLength(500);

        builder.Property(grant => grant.GrantedAtUtc)
            .IsRequired();

        builder.HasIndex(grant => new { grant.UserId, grant.Type, grant.CommunityId })
            .IsUnique()
            .HasFilter("[RevokedAtUtc] IS NULL");

        builder.HasIndex(grant => grant.UserId);
        builder.HasIndex(grant => grant.CommunityId);

        builder.HasOne(grant => grant.User)
            .WithMany()
            .HasForeignKey(grant => grant.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityEntity>(grant => grant.Community)
            .WithMany()
            .HasForeignKey(grant => grant.CommunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(grant => grant.BadgeRequest)
            .WithOne(request => request.Grant)
            .HasForeignKey<BadgeGrant>(grant => grant.BadgeRequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(grant => grant.GrantedBy)
            .WithMany()
            .HasForeignKey(grant => grant.GrantedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_BadgeGrants_TypeCommunity",
            "([Type] = 'Expert' AND [CommunityId] IS NOT NULL) OR ([Type] = 'Scholar' AND [CommunityId] IS NULL)"));
    }
}