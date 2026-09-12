<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('memo_order', function (Blueprint $table) {
            $table->id();
            
            $table->string('originating_department');
            $table->string('memo_no');
            $table->text('recipients'); // can be long
            $table->string('subject');
            $table->date('date_of_effectivity');
            $table->date('date_issued');
            $table->string('status'); // e.g., Draft, Issued, etc.
            $table->text('remarks')->nullable();
            $table->string('file_path')->nullable(); // path to uploaded file

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memo_order');
    }
};
