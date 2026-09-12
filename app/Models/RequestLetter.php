<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestLetter extends Model
{
    protected $table = 'request_letter';

    protected $fillable = [
        'subject',
        'title',
        'status',
        'time',
        'start_date',
        'due_date',
        'assigned_to',
        'file_path'
    ];
}
