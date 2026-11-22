using graduation_project_backend.Models.Exam;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ExamVersionConfiguration : IEntityTypeConfiguration<ExamVersion>
{
    public void Configure(EntityTypeBuilder<ExamVersion> builder)
    {
        builder.HasKey(version => version.Id);
        builder.HasAlternateKey(version => new { version.ExamId, version.Id });

        builder.Property(version => version.Title)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(version => version.Description)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(version => version.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(version => new { version.ExamId, version.VersionNumber })
            .IsUnique();

        builder.HasOne(version => version.Exam)
            .WithMany(exam => exam.Versions)
            .HasForeignKey(version => version.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_ExamVersions_VersionNumber",
            "[VersionNumber] > 0"));

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_ExamVersions_DurationMinutes",
            "[DurationMinutes] IN (3, 5, 10, 15, 20, 30, 45, 60, 90, 120)"));
    }
}
