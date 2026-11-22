using graduation_project_backend.Models.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.HasKey(branch => branch.Id);

        builder.HasAlternateKey(branch => new { branch.CommunityId, branch.Id });

        builder.Property(branch => branch.NameAr)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(branch => branch.NameEn)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(branch => branch.DescriptionAr)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(branch => branch.DescriptionEn)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(branch => branch.TagsJson)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(branch => branch.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(branch => new { branch.CommunityId, branch.NameAr })
            .IsUnique();

        builder.HasIndex(branch => new { branch.CommunityId, branch.NameEn })
            .IsUnique();

        builder.HasOne(branch => branch.Community)
            .WithMany(community => community.Branches)
            .HasForeignKey(branch => branch.CommunityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}