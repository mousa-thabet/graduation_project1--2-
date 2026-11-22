using graduation_project_backend.Models.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class CommunityConfiguration : IEntityTypeConfiguration<Community>
{
    public void Configure(EntityTypeBuilder<Community> builder)
    {
        builder.HasKey(community => community.Id);

        builder.Property(community => community.NameAr)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(community => community.NameEn)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(community => community.DescriptionAr)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(community => community.DescriptionEn)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(community => community.Color)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(community => community.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(community => community.NameAr)
            .IsUnique();

        builder.HasIndex(community => community.NameEn)
            .IsUnique();

        builder.HasIndex(community => community.IsGeneral)
            .IsUnique()
            .HasFilter("[IsGeneral] = 1");
    }
}