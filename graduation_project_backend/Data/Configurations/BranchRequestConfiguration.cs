using graduation_project_backend.Models.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BranchRequestConfiguration : IEntityTypeConfiguration<BranchRequest>
{
    public void Configure(EntityTypeBuilder<BranchRequest> builder)
    {
        builder.HasKey(request => request.Id);

        builder.Property(request => request.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(request => request.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(request => request.TagsJson)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(request => request.Reason)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(request => request.Status)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(request => request.RejectReason)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(request => request.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(request => new { request.ApplicantId, request.CommunityId, request.Name })
            .IsUnique()
            .HasFilter("[Status] = 'Pending'");

        builder.HasIndex(request => request.CommunityId);
        builder.HasIndex(request => request.ApplicantId);
        builder.HasIndex(request => request.RequestedBranchId);

        builder.HasOne(request => request.Community)
            .WithMany(community => community.BranchRequests)
            .HasForeignKey(request => request.CommunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(request => request.Applicant)
            .WithMany()
            .HasForeignKey(request => request.ApplicantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(request => request.ReviewedBy)
            .WithMany()
            .HasForeignKey(request => request.ReviewedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}