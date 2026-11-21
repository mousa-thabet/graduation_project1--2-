using graduation_project_backend.Models.Profile;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class UserStudyProfileConfiguration : IEntityTypeConfiguration<UserStudyProfile>
{
    public void Configure(EntityTypeBuilder<UserStudyProfile> builder)
    {
        builder.HasKey(profile => profile.UserId);

        builder.Property(profile => profile.Bio)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(profile => profile.University)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(profile => profile.Location)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(profile => profile.Website)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(profile => profile.JoinedAtUtc)
            .IsRequired();
    }
}