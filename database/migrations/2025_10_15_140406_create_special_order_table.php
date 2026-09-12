<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('special_order', function (Blueprint $table) {
            $table->id();
            $table->string('originating_department');
            $table->string('so_no');
            $table->text('recipients');
            $table->string('subject');
            $table->string('amount');
            $table->date('date_issued');
            $table->string('status');
            $table->text('remarks')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('special_order');
    }
};
