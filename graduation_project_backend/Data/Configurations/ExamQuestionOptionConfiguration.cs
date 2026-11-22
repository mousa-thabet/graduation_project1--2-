using graduation_project_backend.Models.Exam;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ExamQuestionOptionConfiguration : IEntityTypeConfiguration<ExamQuestionOption>
{
    public void Configure(EntityTypeBuilder<ExamQuestionOption> builder)
    {
        builder.HasKey(option => option.Id);
        builder.HasAlternateKey(option => new { option.ExamQuestionId, option.Id });

        builder.Property(option => option.Text)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(option => new { option.ExamQuestionId, option.DisplayOrder })
            .IsUnique();

        builder.HasOne(option => option.ExamQuestion)
            .WithMany(question => question.Options)
            .HasForeignKey(option => option.ExamQuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
