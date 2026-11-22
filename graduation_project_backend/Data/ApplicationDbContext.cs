using graduation_project_backend.Models.Auth;
using graduation_project_backend.Models.Badge;
using graduation_project_backend.Models.Community;
using graduation_project_backend.Models.Content;
using graduation_project_backend.Models.Exam;
using graduation_project_backend.Models.Profile;
using graduation_project_backend.Models.Social;
using graduation_project_backend.Models.User;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace graduation_project_backend.Data;

public sealed class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();
    public DbSet<UserStudyProfile> UserStudyProfiles => Set<UserStudyProfile>();
    public DbSet<UserCommunityProfile> UserCommunityProfiles => Set<UserCommunityProfile>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Community> Communities => Set<Community>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<CommunityMembership> CommunityMemberships => Set<CommunityMembership>();
    public DbSet<BranchMembership> BranchMemberships => Set<BranchMembership>();
    public DbSet<BranchRequest> BranchRequests => Set<BranchRequest>();
    public DbSet<BadgeGrant> BadgeGrants => Set<BadgeGrant>();
    public DbSet<BadgeRequest> BadgeRequests => Set<BadgeRequest>();
    public DbSet<BadgeExperience> BadgeExperiences => Set<BadgeExperience>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PostMedia> PostMedia => Set<PostMedia>();
    public DbSet<PostTag> PostTags => Set<PostTag>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();
    public DbSet<CommentLike> CommentLikes => Set<CommentLike>();
    public DbSet<PostSave> PostSaves => Set<PostSave>();
    public DbSet<Poll> Polls => Set<Poll>();
    public DbSet<PollOption> PollOptions => Set<PollOption>();
    public DbSet<PollVote> PollVotes => Set<PollVote>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamVersion> ExamVersions => Set<ExamVersion>();
    public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();
    public DbSet<ExamQuestionOption> ExamQuestionOptions => Set<ExamQuestionOption>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<ExamAnswer> ExamAnswers => Set<ExamAnswer>();

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        builder.Entity<PasswordResetCode>(entity =>
        {
            entity.HasKey(resetCode => resetCode.Id);
            entity.Property(resetCode => resetCode.CodeHash)
                .HasMaxLength(512)
                .IsRequired();

            entity.HasIndex(resetCode => new
            {
                resetCode.UserId,
                resetCode.ExpiresAtUtc,
                resetCode.UsedAtUtc,
                resetCode.RevokedAtUtc
            });

            entity.HasOne(resetCode => resetCode.User)
                .WithMany()
                .HasForeignKey(resetCode => resetCode.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
