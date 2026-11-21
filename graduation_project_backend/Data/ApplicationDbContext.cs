using graduation_project_backend.Models.Auth;
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
