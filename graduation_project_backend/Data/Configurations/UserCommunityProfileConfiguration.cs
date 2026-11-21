using graduation_project_backend.Models.Profile;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class UserCommunityProfileConfiguration : IEntityTypeConfiguration<UserCommunityProfile>
{
    public void Configure(EntityTypeBuilder<UserCommunityProfile> builder)
    {
        builder.HasKey(profile => profile.UserId);

        builder.Property(profile => profile.Headline)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(profile => profile.Bio)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(profile => profile.University)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(profile => profile.Website)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(profile => profile.JoinedAtUtc)
            .IsRequired();
    }
}