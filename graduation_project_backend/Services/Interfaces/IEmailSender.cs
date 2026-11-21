namespace graduation_project_backend.Services.Interfaces;

public interface IEmailSender
{
    bool IsConfigured { get; }

    Task<bool> SendPasswordResetCodeAsync(
        string recipientEmail,
        string code,
        CancellationToken cancellationToken = default);
}
