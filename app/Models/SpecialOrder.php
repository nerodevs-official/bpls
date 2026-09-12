<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpecialOrder extends Model
{
    protected $table = 'special_order';

    protected $fillable = [
        'originating_department',
        'so_no',
        'recipients',
        'subject',
        'amount',
        'date_issued',
        'status',
        'remarks',
        'file_path',
        'assigned_to'
    ];

    protected $casts = [
        'date_issued' => 'date',
    ];
}
