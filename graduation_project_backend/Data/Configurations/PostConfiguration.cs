using graduation_project_backend.Models.Content;
using CommunityEntity = graduation_project_backend.Models.Community.Community;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.HasKey(post => post.Id);

        builder.Property(post => post.Section)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(post => post.Type)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(post => post.Text)
            .HasMaxLength(280)
            .IsRequired();

        builder.Property(post => post.AchievementTask)
            .HasMaxLength(200);

        builder.Property(post => post.LiveStatus)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(post => post.ModerationReason)
            .HasMaxLength(500);

        builder.Property(post => post.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(post => new { post.Section, post.CreatedAtUtc })
            .HasFilter("[DeletedAtUtc] IS NULL");

        builder.HasIndex(post => new { post.AuthorId, post.CreatedAtUtc });
        builder.HasIndex(post => new { post.CommunityId, post.CreatedAtUtc })
            .HasFilter("[DeletedAtUtc] IS NULL");
        builder.HasIndex(post => new { post.BranchId, post.CreatedAtUtc })
            .HasFilter("[DeletedAtUtc] IS NULL");

        builder.HasOne(post => post.Author)
            .WithMany()
            .HasForeignKey(post => post.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CommunityEntity>(post => post.Community)
            .WithMany()
            .HasForeignKey(post => post.CommunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(post => post.Branch)
            .WithMany()
            .HasForeignKey(post => new { post.CommunityId, post.BranchId })
            .HasPrincipalKey(branch => new { branch.CommunityId, branch.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(post => post.ModeratedBy)
            .WithMany()
            .HasForeignKey(post => post.ModeratedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_Posts_SectionContext",
            "([Section] = 'Study' AND [CommunityId] IS NULL AND [BranchId] IS NULL) OR ([Section] = 'Community' AND [CommunityId] IS NOT NULL)"));
    }
}
