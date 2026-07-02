<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    /**
     * Build the mail representation of the notification.
     * Inherits resetUrl() and token handling from parent.
     */
    public function toMail($notifiable): MailMessage
    {
        $expireMinutes = config(
            'auth.passwords.' . config('auth.defaults.passwords') . '.expire'
        );

        return (new MailMessage)
            ->subject('Atur Ulang Password - Pemancingan Sutoyo')
            ->greeting('Halo, ' . $notifiable->name . '!')
            ->line('Kami menerima permintaan untuk mengatur ulang password akun Anda.')
            ->action('Atur Ulang Password', $this->resetUrl($notifiable))
            ->line('Link ini akan kedaluwarsa dalam ' . $expireMinutes . ' menit.')
            ->line('Jika Anda tidak meminta perubahan password, abaikan email ini.')
            ->salutation('Salam, Pemancingan Sutoyo');
    }
}
