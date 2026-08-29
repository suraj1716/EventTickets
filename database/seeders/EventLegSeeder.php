<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class EventLegSeeder extends Seeder
{
 public function run(): void
 {
  $events=DB::table('events')->whereNull('deleted_at')->get(); $venues=DB::table('venues')->where('is_active',1)->get()->keyBy('city');
  foreach($events as $event){$venue=$venues->first(); $cities=$event->type==='tour'?array_values($venues->all()):[$venue]; foreach($cities as $i=>$v){ if(!$v) continue; $date=now()->addDays(30+$i*21)->toDateString(); $exists=DB::table('event_legs')->where('event_id',$event->id)->where('sequence',$i+1)->first(); $d=['event_id'=>$event->id,'venue_id'=>$v->id,'venue_name'=>$v->name,'address'=>$v->address,'city'=>$v->city,'latitude'=>$v->latitude,'longitude'=>$v->longitude,'event_date'=>$date,'capacity'=>$v->capacity??100,'sequence'=>$i+1,'seating_type'=>$event->name==='Brisbane Family Festival'?'general':'reserved','updated_at'=>now()]; if($exists)DB::table('event_legs')->where('id',$exists->id)->update($d);else{$d['created_at']=now();DB::table('event_legs')->insert($d);} } }
 }
}
