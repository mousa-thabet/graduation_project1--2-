using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class CommentLikeConfiguration : IEntityTypeConfiguration<CommentLike>
{
    public void Configure(EntityTypeBuilder<CommentLike> builder)
    {
        builder.HasKey(like => like.Id);

        builder.Property(like => like.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(like => new { like.CommentId, like.UserId })
            .IsUnique();
        builder.HasIndex(like => like.UserId);

        builder.HasOne(like => like.Comment)
            .WithMany(comment => comment.Likes)
            .HasForeignKey(like => like.CommentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(like => like.User)
            .WithMany()
            .HasForeignKey(like => like.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
