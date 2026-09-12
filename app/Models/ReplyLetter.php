<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReplyLetter extends Model
{
    protected $table = 'reply_letter';

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
