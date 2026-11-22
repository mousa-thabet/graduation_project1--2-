using graduation_project_backend.Models.Content;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace graduation_project_backend.Data.Configurations;

public sealed class PollVoteConfiguration : IEntityTypeConfiguration<PollVote>
{
    public void Configure(EntityTypeBuilder<PollVote> builder)
    {
        builder.HasKey(vote => vote.Id);

        builder.Property(vote => vote.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(vote => new { vote.PollId, vote.UserId })
            .IsUnique();
        builder.HasIndex(vote => vote.UserId);
        builder.HasIndex(vote => vote.PollOptionId);

        builder.HasOne(vote => vote.Poll)
            .WithMany(poll => poll.Votes)
            .HasForeignKey(vote => vote.PollId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(vote => vote.PollOption)
            .WithMany(option => option.Votes)
            .HasForeignKey(vote => new { vote.PollId, vote.PollOptionId })
            .HasPrincipalKey(option => new { option.PollId, option.Id })
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(vote => vote.User)
            .WithMany()
            .HasForeignKey(vote => vote.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
