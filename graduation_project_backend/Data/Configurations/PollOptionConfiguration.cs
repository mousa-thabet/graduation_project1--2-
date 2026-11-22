using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PollOptionConfiguration : IEntityTypeConfiguration<PollOption>
{
    public void Configure(EntityTypeBuilder<PollOption> builder)
    {
        builder.HasKey(option => option.Id);

        builder.Property(option => option.Text)
            .HasMaxLength(40)
            .IsRequired();

        builder.HasAlternateKey(option => new { option.PollId, option.Id });
        builder.HasIndex(option => new { option.PollId, option.SortOrder })
            .IsUnique();

        builder.HasOne(option => option.Poll)
            .WithMany(poll => poll.Options)
            .HasForeignKey(option => option.PollId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
