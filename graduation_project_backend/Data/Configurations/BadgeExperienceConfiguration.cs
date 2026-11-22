using graduation_project_backend.Models.Badge;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BadgeExperienceConfiguration : IEntityTypeConfiguration<BadgeExperience>
{
    public void Configure(EntityTypeBuilder<BadgeExperience> builder)
    {
        builder.HasKey(experience => experience.Id);

        builder.Property(experience => experience.Credential)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(experience => experience.Details)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(experience => experience.Proof)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(experience => experience.VerifiedAtUtc)
            .IsRequired();

        builder.HasIndex(experience => experience.BadgeGrantId)
            .IsUnique();

        builder.HasIndex(experience => experience.UserId);

        builder.HasOne(experience => experience.User)
            .WithMany()
            .HasForeignKey(experience => experience.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(experience => experience.BadgeGrant)
            .WithOne(grant => grant.Experience)
            .HasForeignKey<BadgeExperience>(experience => experience.BadgeGrantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(experience => experience.VerifiedBy)
            .WithMany()
            .HasForeignKey(experience => experience.VerifiedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}