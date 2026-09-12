<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExecutiveOrder extends Model
{
    protected $table = 'executive_order';

    protected $fillable = [
        'originating_department',
        'eo_no',
        'title',
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
