<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class TicketTierSeeder extends Seeder
{
 public function run(): void
 {
  foreach(DB::table('event_legs')->get() as $leg){foreach([['Early Bird',39.00],['General Admission',59.00],['VIP',99.00]] as $i=>[$name,$price]){DB::table('ticket_tiers')->updateOrInsert(['event_leg_id'=>$leg->id,'name'=>$name],['price'=>$price,'quantity'=>100,'remaining'=>100,'starts_at'=>now()->subDay(),'ends_at'=>now()->addMonths(3),'updated_at'=>now(),'created_at'=>now()]);}}
 }
}
