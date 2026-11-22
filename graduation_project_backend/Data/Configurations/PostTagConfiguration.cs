using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PostTagConfiguration : IEntityTypeConfiguration<PostTag>
{
    public void Configure(EntityTypeBuilder<PostTag> builder)
    {
        builder.HasKey(tag => tag.Id);

        builder.Property(tag => tag.Value)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(tag => new { tag.PostId, tag.Value })
            .IsUnique();

        builder.HasIndex(tag => tag.Value);

        builder.HasOne(tag => tag.Post)
            .WithMany(post => post.Tags)
            .HasForeignKey(tag => tag.PostId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
