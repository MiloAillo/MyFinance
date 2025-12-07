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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tracker_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->string('name');
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->timestamp('transaction_date');
            $table->timestamps();

            $table->index(['tracker_id', 'transaction_date']);
            $table->index(['user_id', 'type', 'transaction_date']);
            $table->index(['name', 'transaction_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('transactions');
        Schema::enableForeignKeyConstraints();
    }
};
