using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PostLikeConfiguration : IEntityTypeConfiguration<PostLike>
{
    public void Configure(EntityTypeBuilder<PostLike> builder)
    {
        builder.HasKey(like => like.Id);

        builder.Property(like => like.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(like => new { like.PostId, like.UserId })
            .IsUnique();
        builder.HasIndex(like => like.UserId);

        builder.HasOne(like => like.Post)
            .WithMany(post => post.Likes)
            .HasForeignKey(like => like.PostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(like => like.User)
            .WithMany()
            .HasForeignKey(like => like.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
