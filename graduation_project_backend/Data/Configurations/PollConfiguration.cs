using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PollConfiguration : IEntityTypeConfiguration<Poll>
{
    public void Configure(EntityTypeBuilder<Poll> builder)
    {
        builder.HasKey(poll => poll.Id);

        builder.HasIndex(poll => poll.PostId)
            .IsUnique();

        builder.HasOne(poll => poll.Post)
            .WithOne(post => post.Poll)
            .HasForeignKey<Poll>(poll => poll.PostId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
