<?php

namespace App\Exceptions\API\V1\Auth;

use Exception;

class NewDeviceLoginDetectedException extends Exception
{
    protected $message = "New device login detected.";
    protected $customStatus = 'NEW_DEVICE_LOGIN_DETECTED';
    protected $code = 403;

    public function __construct(?string $message = null) {
        parent::__construct($message ? "{$this->message} {$message}" : $this->message);
    }

    public function getCustomStatus(): string
    {
        return $this->customStatus;
    }
}
