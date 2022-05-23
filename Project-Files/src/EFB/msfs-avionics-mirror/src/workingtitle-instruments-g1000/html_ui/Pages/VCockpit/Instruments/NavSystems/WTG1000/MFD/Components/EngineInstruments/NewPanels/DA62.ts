export const xmlConfig = `
<EngineDisplay>
	<EnginePage>
		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
				<TextIncrement>1</TextIncrement>
			</Style>
			<ID>Piston_LoadGauge</ID>
			<Title>Load</Title>
			<Unit></Unit>
			<Minimum>0</Minimum>
			<Maximum>100</Maximum>
			<Value>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:1" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value>
			<Value2>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:2" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:2" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value2>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>95</Begin>
				<End>100</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>95</End>
			</ColorZone>
			<GraduationLength text="True">20</GraduationLength>
			<BeginText>%</BeginText>
		</Gauge>

		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
			</Style>
			<ID>Piston_RPMGauge</ID>
			<Title></Title>
			<Unit>RPM</Unit>
			<Minimum>0</Minimum>
			<Maximum>3000</Maximum>
			<Value>
				<Simvar name="PROP RPM:1" unit="rpm"/>
			</Value>
			<Value2>
				<Simvar name="PROP RPM:2" unit="rpm"/>
			</Value2>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>2325</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>2325</Begin>
				<End>2375</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>2375</Begin>
				<End>3000</End>
			</ColorZone>
			<GraduationLength text="True">600</GraduationLength>
		</Gauge>

		<Text>
			<Center>Fuel Flow</Center>
		</Text>

		<Text>
			<Left>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
				</ToFixed>
			</Left>
			<Center>GPH</Center>
			<Right>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:2" unit="gallons per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_OilTempGauge</ID>
			<Title>Oil Temp</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>-40</Minimum>			<!-- Not Sure -->
			<Maximum>150</Maximum>			<!-- Not Sure -->
			<Value>
				<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
			</Value>
			<Value2>
				<Simvar name="GENERAL ENG OIL TEMPERATURE:2" unit="celsius"/>
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>-40</Begin>				<!-- Not Sure -->
				<End>-30</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>-30</Begin>
				<End>50</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>50</Begin>
				<End>135</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>135</Begin>
				<End>139</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>139</Begin>
				<End>150</End>				<!-- Not Sure -->
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_OilPressGauge</ID>
			<Title>Oil Press</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>			<!-- Not Sure -->
			<Maximum>7</Maximum>			<!-- Not Sure -->
			<Value>
				<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="bar"/>
			</Value>
			<Value2>
				<Simvar name="GENERAL ENG OIL PRESSURE:2" unit="bar"/>
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>				<!-- Not Sure -->
				<End>0.9</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>0.9</Begin>
				<End>2.5</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>2.5</Begin>
				<End>6</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>6</Begin>
				<End>6.5</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>6.5</Begin>
				<End>7</End>				<!-- Not Sure -->
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_CoolantTempGauge</ID>
			<Title>Coolant Temp</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>-40</Minimum>			<!-- Not Sure -->
			<Maximum>150</Maximum>			<!-- Not Sure -->
			<Value>
				<Simvar name="RECIP ENG RADIATOR TEMPERATURE:1" unit="celsius"/>
			</Value>
			<Value2>
				<Simvar name="RECIP ENG RADIATOR TEMPERATURE:2" unit="celsius"/>
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>-40</Begin>				<!-- Not Sure -->
				<End>-30</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>-30</Begin>
				<End>60</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>60</Begin>
				<End>95</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>95</Begin>
				<End>100</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>100</Begin>
				<End>150</End>				<!-- Not Sure -->
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelTempGauge</ID>
			<Title>Fuel Temp</Title>
			<Unit></Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>-40</Minimum>			<!-- Not Sure -->
			<Maximum>100</Maximum>			<!-- Not Sure -->
			<Value>
				30
			</Value>
			<Value2>
				30
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>-40</Begin>				<!-- Not Sure -->
				<End>-30</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>-30</Begin>
				<End>55</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>55</Begin>
				<End>60</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>60</Begin>
				<End>100</End>				<!-- Not Sure -->
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
		</Gauge>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelGauge</ID>
			<Title>Fuel QTY</Title>
			<Unit>GAL</Unit>
			<CursorText>L</CursorText>
			<CursorText2>R</CursorText2>
			<Minimum>0</Minimum>
			<Maximum>25</Maximum>
			<Value>
				<Simvar name="FUEL TANK LEFT MAIN QUANTITY" unit="gallons"/>
			</Value>
			<Value2>
				<Simvar name="FUEL TANK RIGHT MAIN QUANTITY" unit="gallons"/>
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>
				<End>1</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>1</Begin>
				<End>25</End>
			</ColorZone>
			<GraduationLength text="True">5</GraduationLength>
		</Gauge>

		<Text>
			<Left>
				<ToFixed precison="0">
					<Simvar name="FUEL TANK LEFT AUX QUANTITY" unit="gallons"/>
				</ToFixed>
			</Left>
			<Center>Aux Fuel</Center>
			<Right>
				<ToFixed precison="0">
					<Simvar name="FUEL TANK RIGHT AUX QUANTITY" unit="gallons"/>
				</ToFixed>
			</Right>
		</Text>
	</EnginePage>

	<SystemPage>
		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
				<TextIncrement>1</TextIncrement>
			</Style>
			<ID>Piston_LoadGauge</ID>
			<Title>Load</Title>
			<Unit></Unit>
			<Minimum>0</Minimum>
			<Maximum>100</Maximum>
			<Value>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:1" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value>
			<Value2>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:2" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:2" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value2>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>95</Begin>
				<End>100</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>95</End>
			</ColorZone>
			<GraduationLength text="True">20</GraduationLength>
			<BeginText>%</BeginText>
		</Gauge>

		<Gauge>
			<Type>DoubleVertical</Type>
			<Style>
				<Height>70</Height>
			</Style>
			<ID>Piston_RPMGauge</ID>
			<Title></Title>
			<Unit>RPM</Unit>
			<Minimum>0</Minimum>
			<Maximum>3000</Maximum>
			<Value>
				<Simvar name="PROP RPM:1" unit="rpm"/>
			</Value>
			<Value2>
				<Simvar name="PROP RPM:2" unit="rpm"/>
			</Value2>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>2325</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>2325</Begin>
				<End>2375</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>2375</Begin>
				<End>3000</End>
			</ColorZone>
			<GraduationLength text="True">600</GraduationLength>
		</Gauge>

		<Gauge>
			<Type>Cylinder</Type>
			<ID>EGT_Gauge</ID>
			<Title>EGT</Title>
			<Unit>°F</Unit>
			<Rows>13</Rows>
			<Columns>4</Columns>
			<Minimum>1000</Minimum>
			<Maximum>1700</Maximum>
			<TempOrder>1,3,2,4</TempOrder>
			<Value>
				<Simvar name="GENERAL ENG EXHAUST GAS TEMPERATURE:1" unit="farenheit"/>
			</Value>
			<Style>
				<ShowPeak>True</ShowPeak>
				<TextIncrement>5</TextIncrement>
			</Style>
		</Gauge>

		<Gauge>
			<Type>Cylinder</Type>
			<ID>CHT_Gauge</ID>
			<Title>CHT</Title>
			<Unit>°F</Unit>
			<Rows>13</Rows>
			<Columns>4</Columns>
			<Minimum>100</Minimum>
			<Maximum>500</Maximum>
			<TempOrder>1,3,2,4</TempOrder>
			<Value>
				<Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="farenheit"/>
			</Value>
			<Style>
				<ShowRedline>True</ShowRedline>
				<TextIncrement>5</TextIncrement>
			</Style>
		</Gauge>

		<Text>
			<Left>FFlow GPH</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Gal Rem</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Gal Used</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="L:WT1000_Fuel_GalBurned" unit="gallon"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Endur</Left>
			<Right>
				<If>
					<Condition>
						<Greater>
							<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
							<Constant>0.1</Constant>
						</Greater>
					</Condition>
					<Then>
						<Add>
							<ToFixed precision="2">
								<Divide>
									<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
									<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
								</Divide>
							</ToFixed>
							<Constant>h</Constant>
						</Add>
					</Then>
					<Else>
						<Constant>X</Constant>
					</Else>
				</If>
			</Right>
		</Text>

		<Text>
			<Left>Range NM</Left>
			<Right>
				<If>
					<Condition>
						<Greater>
							<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
							<Constant>0.1</Constant>
						</Greater>
					</Condition>
					<Then>
						<ToFixed precision="0">
							<Multiply>
								<Simvar name="GROUND VELOCITY:1" unit="knots"/>
								<Divide>
									<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
									<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
								</Divide>
							</Multiply>
						</ToFixed>
					</Then>
					<Else>
						<Constant>X</Constant>
					</Else>
				</If>
			</Right>
		</Text>
	</SystemPage>
</EngineDisplay>
`;