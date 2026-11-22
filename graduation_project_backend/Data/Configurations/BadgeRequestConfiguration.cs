using graduation_project_backend.Models.Badge;
using CommunityEntity = graduation_project_backend.Models.Community.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BadgeRequestConfiguration : IEntityTypeConfiguration<BadgeRequest>
{
    public void Configure(EntityTypeBuilder<BadgeRequest> builder)
    {
        builder.HasKey(request => request.Id);

        builder.Property(request => request.Type)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(request => request.About)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(request => request.ProofName)
            .HasMaxLength(260);

        builder.Property(request => request.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(request => request.Reason)
            .HasMaxLength(100);

        builder.Property(request => request.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(request => new { request.ApplicantId, request.Type, request.CommunityId })
            .IsUnique()
            .HasFilter("[Status] = 'Pending'");

        builder.HasIndex(request => request.CommunityId);
        builder.HasIndex(request => request.ApplicantId);

        builder.HasOne(request => request.Applicant)
            .WithMany()
            .HasForeignKey(request => request.ApplicantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityEntity>(request => request.Community)
            .WithMany()
            .HasForeignKey(request => request.CommunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(request => request.ReviewedBy)
            .WithMany()
            .HasForeignKey(request => request.ReviewedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_BadgeRequests_TypeCommunity",
            "([Type] = 'Expert' AND [CommunityId] IS NOT NULL) OR ([Type] = 'Scholar' AND [CommunityId] IS NULL)"));
    }
}