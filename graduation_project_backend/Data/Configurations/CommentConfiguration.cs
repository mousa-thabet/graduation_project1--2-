using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(comment => comment.Id);

        builder.HasAlternateKey(comment => new { comment.PostId, comment.Id });

        builder.Property(comment => comment.Text)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(comment => comment.ReplyToHandle)
            .HasMaxLength(200);

        builder.Property(comment => comment.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(comment => new { comment.PostId, comment.CreatedAtUtc });
        builder.HasIndex(comment => comment.AuthorId);
        builder.HasIndex(comment => comment.ParentCommentId);

        builder.HasOne(comment => comment.Post)
            .WithMany(post => post.Comments)
            .HasForeignKey(comment => comment.PostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(comment => comment.Author)
            .WithMany()
            .HasForeignKey(comment => comment.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(comment => comment.ParentComment)
            .WithMany(comment => comment.Replies)
            .HasForeignKey(comment => new { comment.PostId, comment.ParentCommentId })
            .HasPrincipalKey(comment => new { comment.PostId, comment.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
