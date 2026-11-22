using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PostSaveConfiguration : IEntityTypeConfiguration<PostSave>
{
    public void Configure(EntityTypeBuilder<PostSave> builder)
    {
        builder.HasKey(save => save.Id);

        builder.Property(save => save.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(save => new { save.PostId, save.UserId })
            .IsUnique();
        builder.HasIndex(save => save.UserId);

        builder.HasOne(save => save.Post)
            .WithMany(post => post.Saves)
            .HasForeignKey(save => save.PostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(save => save.User)
            .WithMany()
            .HasForeignKey(save => save.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
