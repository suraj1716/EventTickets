<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class ReviewSeeder extends Seeder
{
 public function run(): void
 {
  $user=DB::table('users')->where('email','emma@example.com')->first(); foreach(DB::table('products')->limit(3)->get() as $p) if($user) DB::table('reviews')->updateOrInsert(['user_id'=>$user->id,'product_id'=>$p->id],['rating'=>5,'comment'=>'Excellent service and a great experience.','comment_title'=>'Highly recommended','updated_at'=>now(),'created_at'=>now()]);
 }
}
