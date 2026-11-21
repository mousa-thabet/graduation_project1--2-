using graduation_project_backend.Services.Interfaces;

namespace graduation_project_backend.Services.Email;

public sealed class UnavailableEmailSender : IEmailSender
{
    public bool IsConfigured => false;

    public Task<bool> SendPasswordResetCodeAsync(
        string recipientEmail,
        string code,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(false);
    }
}
