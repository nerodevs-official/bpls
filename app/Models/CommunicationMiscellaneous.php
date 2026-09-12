<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunicationMiscellaneous extends Model
{
    protected $table = 'communication_miscellaneous';

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
