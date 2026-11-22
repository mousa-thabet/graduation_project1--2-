using graduation_project_backend.Models.Exam;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ExamQuestionConfiguration : IEntityTypeConfiguration<ExamQuestion>
{
    public void Configure(EntityTypeBuilder<ExamQuestion> builder)
    {
        builder.HasKey(question => question.Id);
        builder.HasAlternateKey(question => new { question.ExamVersionId, question.Id });

        builder.Property(question => question.Text)
            .HasMaxLength(600)
            .IsRequired();

        builder.Property(question => question.TableJson)
            .HasMaxLength(12000);

        builder.Property(question => question.Code)
            .HasMaxLength(12000);

        builder.Property(question => question.Explanation)
            .HasMaxLength(600);

        builder.HasIndex(question => new { question.ExamVersionId, question.DisplayOrder })
            .IsUnique();

        builder.HasOne(question => question.ExamVersion)
            .WithMany(version => version.Questions)
            .HasForeignKey(question => question.ExamVersionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(question => question.CorrectOption)
            .WithMany()
            .HasForeignKey(question => new { question.Id, question.CorrectOptionId })
            .HasPrincipalKey(option => new { option.ExamQuestionId, option.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
