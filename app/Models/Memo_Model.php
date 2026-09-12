<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Memo_Model extends Model
{
  protected $table = 'memo_order';

  protected $fillable = [
    'originating_department',
    'memo_no',
    'recipients',
    'subject',
    'date_of_effectivity',
    'date_issued',
    'status',
    'remarks',
    'file_path',
    'assigned_to'
  ];

  // Optional: if you want to cast dates
  protected $casts = [
    'date_of_effectivity' => 'date',
    'date_issued'         => 'date',
  ];
}
