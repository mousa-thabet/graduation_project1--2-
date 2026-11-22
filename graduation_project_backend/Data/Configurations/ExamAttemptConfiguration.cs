using graduation_project_backend.Models.Exam;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ExamAttemptConfiguration : IEntityTypeConfiguration<ExamAttempt>
{
    public void Configure(EntityTypeBuilder<ExamAttempt> builder)
    {
        builder.HasKey(attempt => attempt.Id);
        builder.HasAlternateKey(attempt => new { attempt.ExamVersionId, attempt.Id });

        builder.Property(attempt => attempt.StartedAtUtc)
            .IsRequired();

        builder.HasIndex(attempt => new { attempt.UserId, attempt.ExamVersionId });
        builder.HasIndex(attempt => new { attempt.ExamId, attempt.StartedAtUtc });

        builder.HasOne(attempt => attempt.Exam)
            .WithMany(exam => exam.Attempts)
            .HasForeignKey(attempt => attempt.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(attempt => attempt.ExamVersion)
            .WithMany(version => version.Attempts)
            .HasForeignKey(attempt => new { attempt.ExamId, attempt.ExamVersionId })
            .HasPrincipalKey(version => new { version.ExamId, version.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(attempt => attempt.User)
            .WithMany()
            .HasForeignKey(attempt => attempt.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_ExamAttempts_Score",
            "[Score] IS NULL OR ([Score] >= 0 AND [Score] <= [TotalQuestions])"));

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_ExamAttempts_TotalQuestions",
            "[TotalQuestions] > 0"));
    }
}
