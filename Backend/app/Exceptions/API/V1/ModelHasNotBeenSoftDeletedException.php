<?php

namespace App\Exceptions\API\V1;

use Exception;

class ModelHasNotBeenSoftDeletedException extends Exception
{
    protected $message = "Model has not been soft deleted.";
    protected $code = 400;

    public function __construct(?string $message = null) {
        parent::__construct($message ?: $this->message);
    }
}
