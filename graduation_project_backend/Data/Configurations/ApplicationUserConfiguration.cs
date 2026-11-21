using graduation_project_backend.Models.User;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(user => user.DisplayName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(user => user.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(user => user.StudyProfile)
            .WithOne(profile => profile.User)
            .HasForeignKey<Models.Profile.UserStudyProfile>(profile => profile.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(user => user.CommunityProfile)
            .WithOne(profile => profile.User)
            .HasForeignKey<Models.Profile.UserCommunityProfile>(profile => profile.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}