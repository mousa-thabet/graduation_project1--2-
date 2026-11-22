using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PostMediaConfiguration : IEntityTypeConfiguration<PostMedia>
{
    public void Configure(EntityTypeBuilder<PostMedia> builder)
    {
        builder.HasKey(media => media.Id);

        builder.Property(media => media.Type)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(media => media.Name)
            .HasMaxLength(260);

        builder.HasIndex(media => new { media.PostId, media.SortOrder })
            .IsUnique();

        builder.HasIndex(media => new { media.PostId, media.MediaId })
            .IsUnique();

        builder.HasOne(media => media.Post)
            .WithMany(post => post.Media)
            .HasForeignKey(media => media.PostId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
