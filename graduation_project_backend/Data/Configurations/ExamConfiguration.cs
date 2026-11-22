using graduation_project_backend.Models.Exam;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.HasKey(exam => exam.Id);

        builder.Property(exam => exam.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(exam => new { exam.CommunityId, exam.CreatedAtUtc });
        builder.HasIndex(exam => exam.AuthorId);

        builder.HasOne(exam => exam.Author)
            .WithMany()
            .HasForeignKey(exam => exam.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(exam => exam.Community)
            .WithMany()
            .HasForeignKey(exam => exam.CommunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(exam => exam.Branch)
            .WithMany()
            .HasForeignKey(exam => new { exam.CommunityId, exam.BranchId })
            .HasPrincipalKey(branch => new { branch.CommunityId, branch.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
