using graduation_project_backend.Models.Exam;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ExamAnswerConfiguration : IEntityTypeConfiguration<ExamAnswer>
{
    public void Configure(EntityTypeBuilder<ExamAnswer> builder)
    {
        builder.HasKey(answer => answer.Id);

        builder.Property(answer => answer.AnsweredAtUtc)
            .IsRequired();

        builder.HasIndex(answer => new { answer.ExamAttemptId, answer.ExamQuestionId })
            .IsUnique();

        builder.HasOne(answer => answer.ExamAttempt)
            .WithMany(attempt => attempt.Answers)
            .HasForeignKey(answer => new { answer.ExamVersionId, answer.ExamAttemptId })
            .HasPrincipalKey(attempt => new { attempt.ExamVersionId, attempt.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(answer => answer.ExamQuestion)
            .WithMany(question => question.Answers)
            .HasForeignKey(answer => new { answer.ExamVersionId, answer.ExamQuestionId })
            .HasPrincipalKey(question => new { question.ExamVersionId, question.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(answer => answer.SelectedOption)
            .WithMany(option => option.SelectedAnswers)
            .HasForeignKey(answer => new { answer.ExamQuestionId, answer.SelectedOptionId })
            .HasPrincipalKey(option => new { option.ExamQuestionId, option.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
